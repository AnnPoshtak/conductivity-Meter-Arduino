import sys
import serial
import serial.tools.list_ports
from http.server import HTTPServer, SimpleHTTPRequestHandler


def find_arduino_port():
    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        desc = (p.description or "").lower()
        if any(k in desc for k in ("arduino", "ch340", "usb serial", "usb-serial", "cp210")):
            return p.device
    return ports[0].device if ports else None


port = find_arduino_port()
if not port:
    print("Пристрій не знайдено. Підключіть Arduino по USB і спробуйте ще раз.")
    sys.exit(1)

print(f"Підключено до порту: {port}")
ser = serial.Serial(port, 9600, timeout=1)


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/data':
            while ser.in_waiting > 10:
                ser.readline()
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(line.encode())
        else:
            super().do_GET()


print("Відкрийте у браузері: http://localhost:8000")
HTTPServer(('localhost', 8000), Handler).serve_forever()