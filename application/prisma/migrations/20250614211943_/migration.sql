BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[asset_categories] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [color] NVARCHAR(1000) NOT NULL CONSTRAINT [asset_categories_color_df] DEFAULT '#3B82F6',
    [icon] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [asset_categories_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [asset_categories_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[assets] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [categoryId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [symbol] NVARCHAR(1000),
    [quantity] FLOAT(53) NOT NULL,
    [acquisitionPrice] FLOAT(53) NOT NULL,
    [currentPrice] FLOAT(53) NOT NULL,
    [acquisitionDate] DATETIME2 NOT NULL,
    [currency] NVARCHAR(1000) NOT NULL CONSTRAINT [assets_currency_df] DEFAULT 'JPY',
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [assets_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [assets_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[price_history] (
    [id] NVARCHAR(1000) NOT NULL,
    [assetId] NVARCHAR(1000) NOT NULL,
    [price] FLOAT(53) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [source] NVARCHAR(1000) NOT NULL CONSTRAINT [price_history_source_df] DEFAULT 'manual',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [price_history_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [price_history_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[portfolio_snapshots] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [totalValue] FLOAT(53) NOT NULL,
    [totalGainLoss] FLOAT(53) NOT NULL,
    [totalGainLossPercent] FLOAT(53) NOT NULL,
    [snapshotDate] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [portfolio_snapshots_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [portfolio_snapshots_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[user_sessions] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [tokenHash] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [user_sessions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [user_sessions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [assets_userId_idx] ON [dbo].[assets]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [assets_categoryId_idx] ON [dbo].[assets]([categoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [assets_symbol_idx] ON [dbo].[assets]([symbol]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [price_history_assetId_idx] ON [dbo].[price_history]([assetId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [price_history_date_idx] ON [dbo].[price_history]([date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [portfolio_snapshots_userId_idx] ON [dbo].[portfolio_snapshots]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [portfolio_snapshots_snapshotDate_idx] ON [dbo].[portfolio_snapshots]([snapshotDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [user_sessions_userId_idx] ON [dbo].[user_sessions]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [user_sessions_tokenHash_idx] ON [dbo].[user_sessions]([tokenHash]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [user_sessions_expiresAt_idx] ON [dbo].[user_sessions]([expiresAt]);

-- AddForeignKey
ALTER TABLE [dbo].[assets] ADD CONSTRAINT [assets_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[assets] ADD CONSTRAINT [assets_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[asset_categories]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[price_history] ADD CONSTRAINT [price_history_assetId_fkey] FOREIGN KEY ([assetId]) REFERENCES [dbo].[assets]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[portfolio_snapshots] ADD CONSTRAINT [portfolio_snapshots_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_sessions] ADD CONSTRAINT [user_sessions_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
