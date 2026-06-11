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

// SetDocsRouter mounts the docs mirror. Pages are served at their original
// /zh/docs/... paths so that Next.js JS route definitions match the browser URL,
// allowing React hydration and interactive components (accordions, etc.) to work.
//
// Route summary:
//
//	/docs            → 302 redirect → /zh/docs
//	/docs/*path      → 302 redirect → /zh/docs/*path
//	/zh/docs         → web/docs-mirror/index.html
//	/zh/docs/*path   → web/docs-mirror/<path>/index.html or exact file
//	/_next/*path     → web/docs-mirror/_next/static/... | image serve | 404
//	/assets/newapi.svg → web/docs-mirror/assets/newapi.svg (logo used by docs)
func SetDocsRouter(router *gin.Engine) {
	if _, err := os.Stat(docsMirrorDir); os.IsNotExist(err) {
		router.GET("/docs", docsMirrorMissing)
		router.GET("/docs/*path", docsMirrorMissing)
		return
	}

	// /docs → redirect so top-nav link (/docs/apps) still works
	router.GET("/docs", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/zh/docs")
	})
	router.GET("/docs/*path", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/zh/docs"+c.Param("path"))
	})

	// /zh/docs/* — serve mirror. Files saved without the /zh/docs prefix.
	router.GET("/zh/docs", func(c *gin.Context) {
		serveDocsMirrorFile(c, "index.html")
	})
	router.GET("/zh/docs/*path", func(c *gin.Context) {
		serveDocsMirrorPath(c, c.Param("path"))
	})

	// /_next/* — single wildcard handler for all Next.js internals.
	// Gin/httprouter panics if you mix static + wildcard at the same prefix level.
	router.GET("/_next/*path", func(c *gin.Context) {
		p := c.Param("path")
		if idx := strings.Index(p, "?"); idx != -1 {
			p = p[:idx]
		}
		switch {
		case p == "/image":
			serveDocsImage(c)
		case strings.HasPrefix(p, "/static/"):
			serveDocsMirrorFile(c, "_next"+p)
		default:
			c.Status(http.StatusNotFound)
		}
	})

	// /assets/newapi.svg — docs logo, referenced by original HTML (no rewrite needed)
	router.GET("/assets/newapi.svg", func(c *gin.Context) {
		serveDocsMirrorFile(c, "assets/newapi.svg")
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
