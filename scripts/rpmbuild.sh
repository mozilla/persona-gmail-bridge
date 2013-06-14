#!/bin/bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

set -e

progname=$(basename $0)
TOP="$(cd $(dirname $0)/..; pwd)" # top level of the checkout
cd $TOP

if [ $# -ne 1 ]; then
    echo "Usage: $(basename $0) (GIT_SHA | GIT_TAG | GIT_BRANCH)"
    exit 1
else
    VER=$1
fi

if [ ! $(command -v git) ]; then
    echo >&2 "Git not found. Aborting."
    exit 1
fi

rm -rf rpmbuild
mkdir -p rpmbuild/SOURCES rpmbuild/SPECS rpmbuild/BUILD

export GIT_HASH=$(git rev-parse $VER);
export SIDESHOW_VER="$(echo $VER | sed 's/-/_/g').$GIT_HASH"

git archive -o "$TOP/rpmbuild/SOURCES/sideshow-$SIDESHOW_VER.tar.gz" $GIT_HASH

cd $TOP
set +e

# generate a new spec file with the version baked in
sed "s/__VERSION__/$SIDESHOW_VER/g" scripts/sideshow.spec.template > /tmp/sideshow.spec

echo "Building Source RPM"
rpmbuild --define "_topdir $PWD/rpmbuild" \
    --define "version $SIDESHOW_VER" \
    -ba /tmp/sideshow.spec
