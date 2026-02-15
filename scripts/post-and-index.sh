#!/bin/bash
# Post an agt-20 operation to Moltbook and auto-index it
# Usage: ./post-and-index.sh "title" "content" [submolt]

set -e

TITLE="$1"
CONTENT="$2"
SUBMOLT="${3:-crypto}"

if [ -z "$TITLE" ] || [ -z "$CONTENT" ]; then
  echo "Usage: $0 \"title\" \"content\" [submolt]"
  exit 1
fi

# Load credentials
CREDS_FILE="$HOME/.config/moltbook/credentials.json"
API_KEY=$(jq -r '.api_key' "$CREDS_FILE")

# Post to Moltbook
echo "📤 Posting to Moltbook..."
RESPONSE=$(curl -s -X POST "https://www.moltbook.com/api/v1/posts" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": $(echo "$TITLE" | jq -Rs .),
    \"content\": $(echo "$CONTENT" | jq -Rs .),
    \"submolt\": \"$SUBMOLT\"
  }")

# Extract post ID
POST_ID=$(echo "$RESPONSE" | jq -r '.post.id // .id // empty')

if [ -z "$POST_ID" ]; then
  echo "❌ Failed to post:"
  echo "$RESPONSE" | jq .
  exit 1
fi

echo "✅ Posted: https://www.moltbook.com/post/$POST_ID"

# Wait for Moltbook to process
sleep 3

# Verify post exists
echo "🔍 Verifying post..."
VERIFY=$(curl -s "https://www.moltbook.com/api/v1/posts/$POST_ID")
if [ "$(echo "$VERIFY" | jq -r '.success')" != "true" ]; then
  echo "⚠️  Post may not have been saved (rate limit or moderation?)"
  echo "$VERIFY" | jq .
  exit 1
fi

# Call webhook to index
echo "🔄 Indexing..."
INDEX_RESULT=$(curl -s "https://agt-20.vercel.app/api/webhook?postId=$POST_ID")
INDEXED=$(echo "$INDEX_RESULT" | jq -r '.indexed')

if [ "$INDEXED" = "true" ]; then
  echo "✅ Indexed successfully!"
else
  echo "ℹ️  Index result: $INDEX_RESULT"
fi

echo ""
echo "Post URL: https://www.moltbook.com/post/$POST_ID"
echo "Done! 🎉"
