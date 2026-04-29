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
import shutil
import os
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scheduler")


async def do_nightly_backup():
    """Har kecha 03:00 da avtomatik backup"""
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        backup_dir = os.path.join(backend_dir, "backups")
        os.makedirs(backup_dir, exist_ok=True)
        db_path = os.path.join(backend_dir, "dokon.db")
        if not os.path.exists(db_path):
            return
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(backup_dir, f"dokon_backup_{ts}.db")
        shutil.copy2(db_path, backup_path)

        # 7 kundan eski backuplarni o'chirish
        files = sorted([
            f for f in os.listdir(backup_dir) if f.startswith("dokon_backup_")
        ])
        for old in files[:-7]:
            os.remove(os.path.join(backup_dir, old))

        logger.info(f"[BACKUP] {backup_path} yaratildi")

        # Telegram xabar
        from bot import send_telegram
        await send_telegram(f"✅ <b>Avtomatik Backup</b>\n📁 {os.path.basename(backup_path)}\n🕐 {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    except Exception as e:
        logger.error(f"[BACKUP] Xatolik: {e}")


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="Asia/Tashkent")

    scheduler.add_job(
        send_daily_report,
        CronTrigger(hour=21, minute=0, timezone="Asia/Tashkent"),
        id="daily_report", name="Kunlik savdo hisoboti", replace_existing=True,
    )
    scheduler.add_job(
        send_daily_report,
        CronTrigger(hour=9, minute=0, timezone="Asia/Tashkent"),
        id="morning_report", name="Ertalabki hisobot", replace_existing=True,
    )
    scheduler.add_job(
        check_and_notify_low_stock,
        IntervalTrigger(minutes=30),
        id="low_stock_check", name="Kam zaxira tekshiruvi", replace_existing=True,
    )
    scheduler.add_job(
        do_nightly_backup,
        CronTrigger(hour=3, minute=0, timezone="Asia/Tashkent"),
        id="nightly_backup", name="Kechasi avtomatik backup", replace_existing=True,
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
