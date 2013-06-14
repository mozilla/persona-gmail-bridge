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

rm -rf rpmbuild
mkdir -p rpmbuild/SOURCES rpmbuild/SPECS rpmbuild/BUILD rpmbuild/TMP
git clone . rpmbuild/TMP &>/dev/null
cd rpmbuild/TMP
git checkout $VER &>/dev/null

export GIT_REVISION=$(git log -1 --oneline)
export GIT_HASH=$(echo $GIT_REVISION | cut -d ' ' -f1)
export SIDESHOW_VER="$(echo $VER | sed 's/-/_/g').$GIT_HASH"

tar --exclude .git \
    -czf "$TOP/rpmbuild/SOURCES/sideshow-$SIDESHOW_VER.tar.gz" .

cd $TOP
set +e

# generate a new spec file with the version baked in
sed "s/__VERSION__/$SIDESHOW_VER/g" scripts/sideshow.spec.template > /tmp/sideshow.spec

echo "Building Source RPM"
rpmbuild --define "_topdir $PWD/rpmbuild" \
    --define "version $SIDESHOW_VER" \
    -ba /tmp/sideshow.spec
