#!/bin/bash

# args : 
# $1 - file to sign
# $2 - signed file
# $3 - private key file
# $4... - certificates for the chain

set -e

trap cleanup EXIT
trap cleanup_s 2
trap cleanup_s 3

tmpdir=
sigfile=

function cleanup_s() {
    cleanup 1
}

function cleanup() {
    local rc=$?
    # echo "EXIT : $rc -- $1"
    test -z "$GSM_IN" -a "$rc" -ne 0 && {
        echo
        echo "!!! ------------------------------------------------------ !!!"
        echo "!!! The script had failed with an unexpected error         !!!"
        echo "!!! ------------------------------------------------------ !!!"
    }

    test -n "$tmpdir" && rm -rf "$tmpdir"
    test -n "$sigfile" && rm -f "$sigfile"

    if test -n "$1"; then
        # if we are coming from a signal, let's set GSM_IN
        # to prevent duplicate error message
        export GSM_IN=1
        exit $1
    fi

    return $rc
}

tmpdir="$(mktemp -d)"
sigfile="$(mktemp)"

to_sign="$(readlink -f "$1")"
result="$(readlink -f "$2")"
pk="$(readlink -f "$3")"

(
    cd "$tmpdir"
    unzip $to_sign
)

read -s -p "Private key password:" pkp
echo
if test -n "$pkp"; then
    pkp_env="$pkp"
    pkp="-passin env:pkp_env"
    export pkp_env
fi

echo "2.16.840.1.101.3.4.2.3" >> "$sigfile"

(
    cd "$tmpdir"
    # $TODO : this is inteolerant of spaces in file names
    for i in $(find . -type f|cut -c3-); do
        echo "$i" >> "$sigfile"
        # openssl sha512 -sign "$pk" $pkp $i | openssl base64 -e | tr '\n' ' ' | sed 's/ //g' >> "$sigfile"
        openssl sha512 -binary $i | openssl base64 -e | tr '\n' ' ' | sed 's/ //g' >> "$sigfile"
        echo >> "$sigfile"
    done
    # echo "----- END -----" >> "$sigfile"
)

shift 3
main_cert="$(readlink -f $1)"
add_cert=""
shift 1
while test $# -gt 0; do
    # openssl x509 -in $1 >> $sigfile
    add_cert="$add_cert -certfile $(readlink -f $1)"
    shift
done

rm -f "$result"

(
    cd "$tmpdir"
    cp "$sigfile" xl4-signature.txt
    openssl smime -sign -out xl4-signature.p7 -outform DER -md sha512 -binary -signer $main_cert $add_cert -inkey $pk $pkp -in xl4-signature.txt
    zip -q9r "$result"  .
)

echo "$result created successfully"

exit 0

