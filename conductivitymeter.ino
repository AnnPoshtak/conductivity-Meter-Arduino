const int probe_blue_pin = 12;
const int probe_red_pin = A0;

void setup() {
 Serial.begin(9600);
 pinMode(probe_blue_pin, OUTPUT);
 digitalWrite(probe_blue_pin, LOW);
}

void loop() {
 int signal;
 digitalWrite(probe_blue_pin, HIGH);
 delay(10);
 signal = analogRead(probe_red_pin);
 digitalWrite(probe_blue_pin, LOW);

 Serial.println(signal);
 delay(300);
}

