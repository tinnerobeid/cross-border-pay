"""rename zuripay_fee to halisi_fee

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-06

"""
from alembic import op

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('transfers', 'zuripay_fee', new_column_name='halisi_fee')


def downgrade() -> None:
    op.alter_column('transfers', 'halisi_fee', new_column_name='zuripay_fee')
