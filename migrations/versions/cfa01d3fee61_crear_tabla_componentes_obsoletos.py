"""crear tabla componentes_obsoletos

Revision ID: cfa01d3fee61
Revises: 
Create Date: 2025-03-20 18:37:46.356637

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cfa01d3fee61'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('componente_defectuoso', schema=None) as batch_op:
        batch_op.add_column(sa.Column('inventario_componente', sa.String(length=100), nullable=False))
        batch_op.alter_column('modelo',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
        batch_op.drop_column('inventario')
        batch_op.drop_column('motivo')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('componente_defectuoso', schema=None) as batch_op:
        batch_op.add_column(sa.Column('motivo', sa.TEXT(), autoincrement=False, nullable=False))
        batch_op.add_column(sa.Column('inventario', sa.VARCHAR(length=100), autoincrement=False, nullable=True))
        batch_op.alter_column('modelo',
               existing_type=sa.VARCHAR(length=100),
               nullable=False)
        batch_op.drop_column('inventario_componente')

    # ### end Alembic commands ###
