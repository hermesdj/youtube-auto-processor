const express = require('express')
const expressApp = express()
const cors = require('cors')
const router = express.Router()

expressApp.use(cors());

router.get('/file/:path', function (req, res) {
  let filename = req.params.path;
  console.log('Serving file:', filename)
  res.sendFile(filename)
})

expressApp.use('/', router)

expressApp.listen(8889, () => console.log('Express server listening on 8889 port'))
