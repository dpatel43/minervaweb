#!/bin/sh

#
# /* Copyright (C) Minerva Systems, Inc - All Rights Reserved
#  * Unauthorized copying of this file, via any medium is strictly prohibited
#  * Proprietary and confidential.
#  */
#

# Replace env.js with runtime values
cat <<EOF > /usr/share/nginx/html/assets/env.js
window.__env = {
  apiServer: "${apiServer}"
};
EOF

exec "$@"
