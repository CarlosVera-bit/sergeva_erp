-- Modificar la tabla pedidos_compra para permitir NULL en id_ot e id_solicitante
-- Ya que no todos los pedidos están asociados a una orden de trabajo o tienen solicitante

USE sergeva_erp;

-- Permitir NULL en id_ot (Orden de Trabajo)
ALTER TABLE pedidos_compra 
MODIFY COLUMN id_ot INT NULL;

-- Permitir NULL en id_solicitante (Usuario Solicitante) 
ALTER TABLE pedidos_compra 
MODIFY COLUMN id_solicitante INT NULL;

-- Verificar los cambios
DESCRIBE pedidos_compra;
