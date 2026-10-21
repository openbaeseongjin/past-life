# 캐시 없는 개발 서버 (python 기본 서버는 ES 모듈을 옛것으로 준다). 사용: python tools/serve.py 8780 [루트]
import functools, http.server, os, sys

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def log_message(self, *a): pass

class S(http.server.ThreadingHTTPServer):
    request_queue_size = 128          # 텍스처를 한꺼번에 많이 받을 때 연결 거부(ERR_CONNECTION_REFUSED)가 나지 않게 (기본 5)

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8780
root = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
S(('127.0.0.1', port), functools.partial(H, directory=root)).serve_forever()
