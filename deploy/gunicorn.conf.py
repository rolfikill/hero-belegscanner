# Gunicorn Configuration für HERO Belegscanner
import multiprocessing

# Server Socket
bind = "127.0.0.1:8001"
backlog = 2048

# Worker Processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100

# Restart workers after this many requests, with up to this much jitter
preload_app = True

# Logging
accesslog = "/var/log/gunicorn/hero-belegscanner-access.log"
errorlog = "/var/log/gunicorn/hero-belegscanner-error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "hero-belegscanner"

# Server mechanics
daemon = False
pidfile = "/var/run/gunicorn/hero-belegscanner.pid"
user = "www-data"
group = "www-data"
tmp_upload_dir = None

# SSL (wenn direkt über Gunicorn, normalerweise über Nginx)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile" 