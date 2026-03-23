from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

sid = os.getenv('TWILIO_ACCOUNT_SID')
token = os.getenv('TWILIO_AUTH_TOKEN')
from_number = os.getenv('TWILIO_FROM_NUMBER')

print('SID:', sid)
print('FROM:', from_number)

c = Client(sid, token)
msg = c.messages.create(
    body='ElderMind test SMS from Shivani',
    from_=from_number,
    to='+919962571492'
)
print('Sent:', msg.sid)