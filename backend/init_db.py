from sqlalchemy.ext.asyncio import AsyncSession
import models, auth, crud
from database import engine, AsyncSessionLocal


async def init_db():
    print("[INFO] Ma'lumotlar bazasi yaratilmoqda...")
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        branches = await crud.get_branches(db)
        if not branches:
            print("[INFO] Asosiy Filial yaratilmoqda...")
            new_branch = await crud.create_branch(db, {
                "name": "Asosiy Filial",
                "address": "Toshkent",
                "phone": "+998901234567"
            })
            branch_id = new_branch.id
        else:
            branch_id = branches[0].id

        admin = await crud.get_user_by_username(db, "admin")
        if not admin:
            print("[INFO] Admin foydalanuvchisi yaratilmoqda... (admin / admin123, PIN: 0000)")
            await crud.create_user(db, {
                "username": "admin",
                "full_name": "Administrator",
                "hashed_password": auth.get_password_hash("admin123"),
                "role": models.RoleEnum.owner,
                "pin_code": "0000",
                "branch_id": branch_id,
                "is_active": True,
            })

    print("[OK] Baza muvaffaqiyatli tayyorlandi!")


if __name__ == "__main__":
    import asyncio
    asyncio.run(init_db())
