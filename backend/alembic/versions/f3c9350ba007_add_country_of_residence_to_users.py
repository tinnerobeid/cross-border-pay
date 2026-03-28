"""add_country_of_residence_to_users

Revision ID: f3c9350ba007
Revises: 6e330774dc79
Create Date: 2026-03-25 23:50:18.394972

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f3c9350ba007'
down_revision: Union[str, None] = '6e330774dc79'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('country_of_residence', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'country_of_residence')
    op.create_table('linked_accounts',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('account_type', sa.VARCHAR(length=20), autoincrement=False, nullable=False),
    sa.Column('provider', sa.VARCHAR(length=100), autoincrement=False, nullable=False),
    sa.Column('account_holder', sa.VARCHAR(length=255), autoincrement=False, nullable=False),
    sa.Column('account_number', sa.VARCHAR(length=100), autoincrement=False, nullable=False),
    sa.Column('currency', sa.VARCHAR(length=10), autoincrement=False, nullable=False),
    sa.Column('country', sa.VARCHAR(length=100), autoincrement=False, nullable=False),
    sa.Column('is_default', sa.BOOLEAN(), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='linked_accounts_user_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='linked_accounts_pkey')
    )
    op.create_index('ix_linked_accounts_user_id', 'linked_accounts', ['user_id'], unique=False)
    op.create_index('ix_linked_accounts_id', 'linked_accounts', ['id'], unique=False)
    op.create_table('wallets',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('currency', sa.VARCHAR(length=10), autoincrement=False, nullable=False),
    sa.Column('balance', sa.NUMERIC(precision=18, scale=2), autoincrement=False, nullable=False),
    sa.Column('is_primary', sa.BOOLEAN(), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='wallets_user_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='wallets_pkey'),
    sa.UniqueConstraint('user_id', 'currency', name='uq_user_currency')
    )
    op.create_index('ix_wallets_user_id', 'wallets', ['user_id'], unique=False)
    op.create_index('ix_wallets_id', 'wallets', ['id'], unique=False)
    op.create_table('recipients',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('name', sa.VARCHAR(length=255), autoincrement=False, nullable=False),
    sa.Column('phone', sa.VARCHAR(length=50), autoincrement=False, nullable=False),
    sa.Column('bank_name', sa.VARCHAR(length=255), autoincrement=False, nullable=True),
    sa.Column('account_number', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('country', sa.VARCHAR(length=50), autoincrement=False, nullable=False),
    sa.Column('currency', sa.VARCHAR(length=3), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='recipients_user_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='recipients_pkey')
    )
    op.create_index('ix_recipients_id', 'recipients', ['id'], unique=False)
    # ### end Alembic commands ###
