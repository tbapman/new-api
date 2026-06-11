package router

import (
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// docsMirrorDir is the directory containing the mirrored docs static files.
// It is resolved relative to the working directory at startup.
const docsMirrorDir = "web/docs-mirror"

// SetDocsRouter mounts the /docs static mirror if web/docs-mirror/ exists on disk.
// It handles:
//
//	/docs                            → web/docs-mirror/index.html
//	/docs/apps                       → web/docs-mirror/apps/index.html
//	/docs/_next/image?url=...        → web/docs-mirror/_next/static/media/... (doc images)
//	/docs/_next/static/...           → web/docs-mirror/_next/static/... (JS/CSS assets)
//	/docs/assets/...                 → web/docs-mirror/assets/...
//
// Falls back to 503 with a helpful message when the mirror is not present.
func SetDocsRouter(router *gin.Engine) {
	if _, err := os.Stat(docsMirrorDir); os.IsNotExist(err) {
		router.GET("/docs", docsMirrorMissing)
		router.GET("/docs/*path", docsMirrorMissing)
		return
	}

	// Single /_next/* handler for all Next.js internals used by the docs mirror.
	// Gin/httprouter panics if you mix /_next/image (static) + /_next/static/*path
	// + /_next/*path (wildcard) — they conflict. One wildcard handles all cases.
	// The main SPA (Rsbuild) never uses /_next/; safe to intercept here.
	router.GET("/_next/*path", func(c *gin.Context) {
		p := c.Param("path") // starts with "/"
		// Strip query string
		if idx := strings.Index(p, "?"); idx != -1 {
			p = p[:idx]
		}
		switch {
		case p == "/image":
			// /_next/image?url=... → serve pre-downloaded media file
			serveDocsImage(c)
		case strings.HasPrefix(p, "/static/"):
			// /_next/static/chunks/*.js, /_next/static/css/*.css, etc.
			rel := "_next" + p
			serveDocsMirrorFile(c, rel)
		default:
			// /_next/data/... RSC payloads and anything else we don't have.
			// Return 404 so Next.js handles it gracefully instead of seeing SPA HTML.
			c.Status(http.StatusNotFound)
		}
	})

	router.GET("/docs", func(c *gin.Context) {
		serveDocsMirrorFile(c, "index.html")
	})
	router.GET("/docs/*path", func(c *gin.Context) {
		urlPath := c.Param("path")
		if urlPath == "/_next/image" {
			serveDocsImage(c)
			return
		}
		serveDocsMirrorPath(c, urlPath)
	})
}

// serveDocsImage handles /docs/_next/image?url=/_next/static/media/foo.png
// by serving the pre-downloaded image file directly from the mirror.
func serveDocsImage(c *gin.Context) {
	rawURL := c.Query("url")
	if rawURL == "" {
		c.Status(http.StatusBadRequest)
		return
	}
	// url param may be URL-encoded (e.g. %2F_next%2Fstatic%2Fmedia%2Ffoo.png)
	decoded, err := url.QueryUnescape(rawURL)
	if err != nil {
		c.Status(http.StatusBadRequest)
		return
	}
	// Only serve files under /_next/static/media/ to prevent traversal
	if !strings.HasPrefix(decoded, "/_next/static/media/") {
		c.Status(http.StatusForbidden)
		return
	}
	rel := strings.TrimPrefix(decoded, "/")
	serveDocsMirrorFile(c, rel)
}

// serveDocsMirrorPath resolves the URL sub-path to a file inside web/docs-mirror/.
func serveDocsMirrorPath(c *gin.Context, urlPath string) {
	rel := strings.TrimPrefix(urlPath, "/")

	// Strip query string from asset paths (e.g. file.js?dpl=xxx → file.js)
	if idx := strings.Index(rel, "?"); idx != -1 {
		rel = rel[:idx]
	}

	// Try exact file first (JS, CSS, SVG, images, etc.)
	exact := filepath.Join(docsMirrorDir, filepath.FromSlash(rel))
	if info, err := os.Stat(exact); err == nil && !info.IsDir() {
		serveDocsMirrorFile(c, rel)
		return
	}

	// Try as a docs page: rel/index.html
	indexPath := filepath.Join(rel, "index.html")
	candidate := filepath.Join(docsMirrorDir, filepath.FromSlash(indexPath))
	if _, err := os.Stat(candidate); err == nil {
		serveDocsMirrorFile(c, indexPath)
		return
	}

	c.Status(http.StatusNotFound)
}

// serveDocsMirrorFile sends a file from the docs mirror directory.
func serveDocsMirrorFile(c *gin.Context, rel string) {
	fullPath := filepath.Join(docsMirrorDir, filepath.FromSlash(rel))
	// Security: ensure the resolved path stays within the mirror directory.
	absBase, _ := filepath.Abs(docsMirrorDir)
	absFull, _ := filepath.Abs(fullPath)
	if !strings.HasPrefix(absFull, absBase+string(filepath.Separator)) && absFull != absBase {
		c.Status(http.StatusForbidden)
		return
	}
	c.File(fullPath)
}

// docsMirrorMissing is used when web/docs-mirror/ has not been synced yet.
func docsMirrorMissing(c *gin.Context) {
	c.Data(http.StatusServiceUnavailable, "text/plain; charset=utf-8",
		[]byte("文档镜像尚未同步，请先运行: python3 scripts/sync-docs.py\n\nDocs mirror not synced. Run: python3 scripts/sync-docs.py"))
}
