find node_modules/@aave/ -type f \( -name "*.js" -o -name "*.ts" \) | while read file; do
  sed -i '' -e 's/"ethers"/"ethers-v5"/g' -e "s/'ethers'/'ethers-v5'/g" -e 's/"ethers\//"ethers-v5\//g' -e "s/'ethers\//'ethers-v5\//g" "$file"
done

if [ $? -eq 0 ]; then
  echo "ethers v5 update for aave contract helper"
else
  echo "ethers v5 failed for aave contract helper"
fi
