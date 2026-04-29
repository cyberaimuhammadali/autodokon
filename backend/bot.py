import os
import requests
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
API_URL = "http://localhost:8000/analytics/dashboard"

def send_daily_report():
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in .env")
        print("Iltimos .env faylga Telegram ma'lumotlarini qo'shing.")
        return

    try:
        response = requests.get(API_URL)
        if response.status_code == 200:
            data = response.json()
            
            message = f"""📊 *DokonPro - Kunlik Hisobot* 📊

💰 Bugungi Jami Savdo: *{data['total_sales_today']:,} so'm*
📦 Jami Mahsulotlar Turi: *{data['total_products']}*
👥 Mijozlar Bazasi: *{data['total_customers']} nafar*
⚠️ Tugayotgan Tovarlar: *{data['low_stock_items']} dona*

_DokonPro ERP avtomatik yubordi._
"""
            
            tg_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
            payload = {
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "Markdown"
            }
            requests.post(tg_url, json=payload)
            print("Kunlik hisobot Telegram orqali muvaffaqiyatli yuborildi.")
        else:
            print(f"Error fetching analytics: {response.status_code}")
    except Exception as e:
        print(f"Failed to send report: {e}")

if __name__ == "__main__":
    send_daily_report()
