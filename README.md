# TSSV-example

This project serves as a template example to show how to build a TSSV project on top of the TSSV linrary.  TSSV is not yet ready to be published as an **npm** module,  so in the meantime, we can use [local-package-publisher](https://www.npmjs.com/package/local-package-publisher) to publish TSSV locally from the a local clone of the [TSSV](https://github.com/TypeScriptSystemVerilog/TSSV) repository.


## Linking This Project Repository to TSSV

1. Clone `TSSV`
```
cd ~/
git clone git@github.com:TypeScriptSystemVerilog/TSSV.git
```  
2. Clone this repository
```
cd ~/
git clone git@github.com:TypeScriptSystemVerilog/TSSV-example.git
```   
3. Install `local-package-publisher` globally
```
sudo npm install -g local-package-publisher
```  
4. Publish TSSV locally
```
cd ~/TSSV
sudo local-package-publisher -p
```   
5. Initialize node_modules in this repository
```
cd ~/TSSV-example
npm install
```
6. Link the local TSSV module to this repository
```
cd ~/TSSV-example
npm link tssv
```
7. Prove it all works
```
npx tsc
node out/test/test_FIR2.js 
cat sv-examples/test_FIR2_output/myFIR23.sv
```

