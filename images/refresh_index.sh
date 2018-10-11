echo "[" > index.json
ls . | grep -e "g$" | xargs printf "    \"%s\",\n" >> index.json
echo "]" >> index.json
unix2dos index.json
