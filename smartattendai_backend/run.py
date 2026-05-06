from app import create_app
import os

config_name = os.getenv('FLASK_ENV', 'development')
app = create_app(config_name)

# Start Telegram bot in background thread (daemon)
try:
    from app.telegram_bot.bot import run_bot
    run_bot(app)
except Exception as e:
    import logging
    logging.getLogger(__name__).warning(f"Could not start Telegram bot: {e}")

if __name__ == '__main__':
    host = os.getenv('API_HOST', '0.0.0.0')
    port = int(os.getenv('API_PORT', 5000))
    debug = os.getenv('API_DEBUG', 'True').lower() in ['true', '1', 'yes']
    # NOTE: use_reloader=False required when running background threads
    app.run(host=host, port=port, debug=debug, use_reloader=False)
