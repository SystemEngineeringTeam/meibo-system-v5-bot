# 名簿管理BOT
名簿管理システムv5 の Slack Bot 側のリポジトリです

## セットアップ
```shell
mise setup
```

以下が自動的にセットアップされます:
- .`vscode/settings.json` の作成
- `mise install` の実行 (Bun のインストール)
- `bun install` の実行 (依存関係のインストール)

### Cloudflare Tunnel のセットアップ
Cloudflare Tunnel を使用して外部からアクセス可能にする場合は、以下の手順でセットアップしてください:

1. `bun cloudflared tunnel login`
2. `cloudflared tunnel create <tunnel-name>`
3. `cloudflared tunnel route dns <tunnel-name> <subdomain>.sysken.net`
4. `code ~/.cloudflared/config.yml` で以下の内容を追加
   ```yaml
   tunnel: <tunnel-name>
   credentials-file: ~/.cloudflared/<tunnel-name>.json

   ingress:
     - hostname: <subdomain>.sysken.net
       service: http://127.0.0.1:8787
     - service: http_status:404
   ```
5. `cloudflared tunnel run <tunnel-name>` でトンネルを起動

## 開発
`localhost` のみで動作させる場合
```shell
bun dev
```

Cloudflare Tunnel を使用して外部からアクセス可能にする場合
```shell
bun run tunnel
# or
cloudflared tunnel run <tunnel-name>
```

両方同時に動かす場合
```shell
mise dev
```
