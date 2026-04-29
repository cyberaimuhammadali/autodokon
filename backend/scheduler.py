"""
DokonPro ERP — Avtomatik Scheduler
- Har kuni 21:00 da Telegram ga kunlik hisobot yuboradi
- Har 30 daqiqada kam zaxirani tekshiradi
- Smena yopilganda hisobot yuboradi
"""

import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from bot import send_daily_report, check_and_notify_low_stock
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scheduler")


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="Asia/Tashkent")

    # Kunlik hisobot — har kuni soat 21:00 da
    scheduler.add_job(
        send_daily_report,
        CronTrigger(hour=21, minute=0, timezone="Asia/Tashkent"),
        id="daily_report",
        name="Kunlik savdo hisoboti",
        replace_existing=True,
    )

    # Ertangi soat 09:00 da ham — kechagi hisobot eslatma
    scheduler.add_job(
        send_daily_report,
        CronTrigger(hour=9, minute=0, timezone="Asia/Tashkent"),
        id="morning_report",
        name="Ertalabki hisobot",
        replace_existing=True,
    )

    # Har 30 daqiqada kam zaxira tekshiruvi
    scheduler.add_job(
        check_and_notify_low_stock,
        IntervalTrigger(minutes=30),
        id="low_stock_check",
        name="Kam zaxira tekshiruvi",
        replace_existing=True,
    )

    return scheduler


if __name__ == "__main__":
    async def main():
        scheduler = create_scheduler()
        scheduler.start()
        logger.info("Scheduler ishga tushdi! (Ctrl+C to'xtatish uchun)")
        try:
            await asyncio.sleep(float('inf'))
        except (KeyboardInterrupt, SystemExit):
            scheduler.shutdown()
            logger.info("Scheduler to'xtatildi.")

    asyncio.run(main())
