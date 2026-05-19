from app import create_app
from app.telegram_bot.bot import run_bot
import logging

logging.basicConfig(level=logging.DEBUG)

app = create_app()
run_bot(app)

import time
while True:
    time.sleep(1)
