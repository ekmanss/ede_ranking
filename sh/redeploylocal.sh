
rm -rf generated/ build/
yarn codegen subgraph.local.yaml && yarn build subgraph.local.yaml
yarn remove-local && yarn create-local && yarn deploy-local
