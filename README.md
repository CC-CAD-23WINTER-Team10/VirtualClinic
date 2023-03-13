# VirtualClinic

## Instructions
### Put On A Server With Docker

--Placeholder

### Test Locally With Docker

--Placeholder

### Test Locally Without Docker
+ STEP 1: Create a directory with any name you want.

+ STEP 2: Open a ternimal from this directory, or Open a terminal then change directory to this one.

+ STEP 3: In the terminal run this line:
   ```
   git clone https://github.com/CC-CAD-23WINTER-Team10/VirtualClinic.git .
   ```    
+ STEP 4: Edit the index.js(in project root directory), on line 15:
   ```javascript
   const localhost = true;
   ```
+ STEP 5: run this command in the terminal:
   ```
   npm install
   ```
+ STEP 6: After saving the index.js, there are 4 options for you to run on terminal:

   1. Only test the exsiting codes, without further code change[^1]
      ```
      npm start
      ```
   2. Test the exsiting codes, with monitoring the change of javascript files but you won't change the ts files.[^2]
      ```
      npm run d
      ```
   3. You will change the typescript files and once it changes, the server will automatically restart.[^3]

      ```
      npm run dev
      ```
   4. You already compiled the typescript files and you will not change the typescript files. You want the server restart automatically after other files change.[^4]
      ```
      npm run dev-nm
      ```

[^1]: This will run typescript compiler to generate the javascript files then start the server.
[^2]: This will run typescript compiler to generate the javascript files then start nodemon.
[^3]: This will run tsc-watch and nodemon.
[^4]: This only runs nodemon.
