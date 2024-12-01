#!/bin/sh
# shellcheck shell=dash

get_target_os() {
  local OS_NAME="linux"

  # Credit: https://stackoverflow.com/a/18434831/3015595
  case $(uname | tr '[:upper:]' '[:lower:]') in
    linux*)
      OS_NAME="linux"
      ;;
    darwin*)
      OS_NAME="osx"
      ;;
    msys*)
      OS_NAME="windows"
      ;;
    *)
      OS_NAME="notset"
      ;;
  esac

  echo "$OS_NAME"
}

handle_install_to_target_os() {
    local OS_NAME=$1
    local VERSION=$2

  if [ "$OS_NAME" = "linux" ]; then
    echo "🔍 Detected $OS_NAME-like OS."
    local OS_VERSION="linux-x64"
    echo "⬇️  Downloading kalypso-cli from GitHub"
    download_cli "$OS_VERSION" "$VERSION"
  elif [ "$OS_NAME" = "osx" ]; then
    if [ "$(uname -m)" = 'arm64' ]; then
      echo "🔍 Detected $OS_NAME-like OS."
      local OS_VERSION="darwin-arm64"
      echo "⬇️  Downloading kalypso-cli from GitHub"
      download_cli "$OS_VERSION" "$VERSION"
    else
      echo "🔍 Detected $OS_NAME-like OS."
      local OS_VERSION="darwin-x64"
      echo "⬇️  Downloading kalypso-cli from GitHub"
      download_cli "$OS_VERSION" "$VERSION"
    fi
  elif [ "$OS_NAME" = "windows" ]; then
    echo "🔍 Detected $OS_NAME-like OS."
    local OS_VERSION="win-x64"
    echo "⬇️  Downloading kalypso-cli from GitHub"
    download_cli "$OS_VERSION" "$VERSION"
  elif [ "$OS_NAME" = "notset" ]; then
    echo "❓ Couldn't determine OS. Assuming linux-like"
    local OS_VERSION="linux-x64"
    echo "⬇️  Downloading kalypso-cli from GitHub"
    download_cli "$OS_VERSION" "$VERSION"
  else
    echo "❓ Couldn't determine OS. Assuming linux-like"
    local OS_VERSION="linux-x64"
    echo "⬇️  Downloading kalypso-cli from GitHub"
    download_cli "$OS_VERSION" "$VERSION"
  fi
}

download_cli() {
  local OS_VERSION=$1
  local CLI_VERSION=$2
  curl -s "https://github.com/functional-team/kalypso-cli/releases/download/$CLI_VERSION/kalypso-cli-$OS_VERSION.gz" -L -o kalypso-cli.gz
}

# Credit: https://gist.github.com/lukechilds/a83e1d7127b78fef38c2914c4ececc3c#gistcomment-2758860
get_latest_release_version() {
  local VERSION=$(curl -fsSLI -o /dev/null -w %{url_effective} https://github.com/functional-team/kalypso-cli/releases/latest | sed 's@.*/@@' | xargs)
  echo "$VERSION"
}

main() {
  echo "🔍 Checking local OS"
  OS_NAME=$(get_target_os)
  VERSION=$(get_latest_release_version)

  handle_install_to_target_os "$OS_NAME" "$VERSION"

  # Unzip it
  gunzip kalypso-cli.gz
  chmod u+x kalypso-cli

  echo "🎉 Downloaded v$VERSION"
  echo "✅ Complete."
}

main "$@"