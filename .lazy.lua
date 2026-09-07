-- Project-local Neovim config. lazy.nvim auto-loads this `.lazy.lua` from the
-- current directory (`local_spec = true`), so it applies when editing this repo.

-- Map *.json files to jsonc, as they are actually in jsonc syntax
vim.filetype.add({
	pattern = {
		[".*%.json"] = "jsonc",
	},
})

-- Filetypes that ESLint/oxlint should own as the formatter (code, configs, docs).
-- Mirrors `.vscode/settings.json`: `eslint.validate`
local eslint_support_filetypes = {
	-- Code
	"javascript",
	"javascriptreact",
	"typescript",
	"typescriptreact",
	-- Configurations
	"json",
	"jsonc",
	"yaml",
	"toml",
	-- Documentations
	"markdown",
}

-- Aligns with `.vscode/settings.json`:
--   `editor.formatOnSave: false`        -> `formatting.format_on_save = false`
--   `source.fixAll.eslint: "always"`    -> `eslint_fix_all` autocmd below
--   `source.fixAll.oxc: "always"`       -> `oxlint_fix_all` autocmd below
--   `source.organizeImports: "never"`   -> default (nothing enabled)
--   `files.associations: *.json=jsonc`  -> `vim.filetype.add` above
return {
	{
		"AstroNvim/astrolsp",
		---@type AstroLSPOpts
		opts = {
			-- eslint/yamlls/oxlint are auto-installed by the community packs
			-- (`pack.eslint`, `pack.yaml`, `pack.oxlint`) via mason-lspconfig.
			-- Per-server config is passed to `vim.lsp.config` and merged with the
			-- nvim-lspconfig defaults, so each server's `on_attach` (which creates
			-- the `LspEslintFixAll` / `LspOxlintFixAll` commands) is preserved.
			config = {
				-- Attach eslint to every filetype it should lint/fix.
				eslint = {
					filetypes = eslint_support_filetypes,
				},
			},
			formatting = {
				-- `editor.formatOnSave: false`: no LSP formats on save; fixing is
				-- done by ESLint/oxlint `FixAll` on save (see autocmds below).
				format_on_save = false,
				-- When formatting manually, no LSP client may format the
				-- eslint-owned filetypes: ESLint (via `LspEslintFixAll`) is the
				-- formatter there. NOTE: AstroLSP's `filter` receives the LSP
				-- client; the buffer's filetype is read for the decision.
				filter = function(_)
					if vim.tbl_contains(eslint_support_filetypes, vim.bo.filetype) then
						return false
					end
					return true
				end,
			},
			autocmds = {
				eslint_fix_all = {
					-- Only create the autocmd for buffers where eslint is attached.
					cond = function(client, _)
						return client.name == "eslint"
					end,
					{
						event = "BufWritePre",
						desc = "Fix all ESLint problems on save",
						command = "LspEslintFixAll",
					},
				},
				oxlint_fix_all = {
					-- Mirrors `source.fixAll.oxc: "always"` in `.vscode/settings.json`.
					cond = function(client, _)
						return client.name == "oxlint"
					end,
					{
						event = "BufWritePre",
						desc = "Fix all Oxlint problems on save",
						command = "LspOxlintFixAll",
					},
				},
			},
		},
	},
}
