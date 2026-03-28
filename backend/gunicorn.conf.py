"""Gunicorn configuration for ZuriPay production deployment.

Usage:
  gunicorn app.main:app -c gunicorn.conf.py
"""
import multiprocessing

# ── Binding ───────────────────────────────────────────────────────────────────
bind = "0.0.0.0:8000"

# ── Worker processes ──────────────────────────────────────────────────────────
# Uvicorn workers support async; use (2 * CPUs + 1) as a starting point.
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000

# ── Timeouts ──────────────────────────────────────────────────────────────────
timeout = 120          # kill worker if it doesn't respond in 120s
graceful_timeout = 30  # wait up to 30s for workers to finish on restart
keepalive = 5          # keep TCP connection open for 5s between requests

# ── Request cycling ───────────────────────────────────────────────────────────
# Restart workers after N requests to avoid memory leaks.
max_requests = 1000
max_requests_jitter = 100  # randomise to avoid thundering herd

# ── Logging ───────────────────────────────────────────────────────────────────
accesslog = "-"   # stdout
errorlog = "-"    # stdout
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)sµs'

# ── Security ──────────────────────────────────────────────────────────────────
limit_request_line = 4094
limit_request_fields = 100
forwarded_allow_ips = "*"   # trust X-Forwarded-For from reverse proxy (nginx)
