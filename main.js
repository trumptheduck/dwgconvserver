const util = require('util');
const exec = util.promisify(require('child_process').exec);
const express = require('express')
const multer  = require('multer')
const path = require('path');
const app = express()
const jsonfile = require('jsonfile')
const reproject = require('reproject')
const epsg = require('epsg')
const proj4 = require('proj4')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
})
  

const upload = multer({ storage: storage})


app.post('/dwg', upload.single('file'), async (req, res, next) => {
    try {
        let filepath = path.join(process.cwd(), req.file.destination, req.file.filename)
        let destpath = path.join(process.cwd(), "results", req.file.filename + ".json")
        let promise = exec(`dwgread ${filepath} -O GeoJSON -o ${destpath}`);
        const child = promise.child; 
        const { stdout, stderr } = await promise;
        let geojson = await jsonfile.readFile(destpath);
        let result = reproject.reproject(geojson, epsg['EPSG:32648'], epsg['EPSG:3857']);
        return res.status(200).json(result);
    } catch (err) {
        console.log(err);
        return res.status(500).json({msg: "Error"});
    }
})

app.listen(3775, () => {
    console.log("Listening at 3775");
})