#!/usr/bin/env bash

# This script exports env variables for mise.

set -eo pipefail

# Set fnox age key path
export FNOX_AGE_KEY=$(cat ~/.config/fnox/age.txt | grep "AGE-SECRET-KEY")