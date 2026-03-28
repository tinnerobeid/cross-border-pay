"""add pin_hash to users

Revision ID: a1b2c3d4e5f6
Revises: f3c9350ba007
Create Date: 2026-03-26

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'f3c9350ba007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('pin_hash', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'pin_hash')
