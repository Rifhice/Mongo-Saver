require("dotenv").config();
const schedule = require('node-schedule');
const { exec } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');
const moment = require('moment')
const AWS = require('aws-sdk');
var dir = 'zips';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

const s3 = new AWS.S3({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey
});

const uploadFile = (fileName) => {
    fs.readFile(fileName, (err, data) => {
        if (err) throw err;
        const params = {
            Bucket: 'waapi-linkedin',
            Key: fileName,
            Body: data
        };
        s3.upload(params, (s3Err, data) => {
            if (s3Err) throw s3Err
            console.log(`File uploaded successfully at ${data.Location}`)
        });
    });
};

const zipDirectory = (source, out) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(out);

    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on('error', err => reject(err))
            .pipe(stream)
            ;

        stream.on('close', () => resolve());
        archive.finalize();
    });
}

const saveMongoState = () => {
    exec(`mongodump -h ${process.env.MONGO_URL} --forceTableScan`, (err, stdout, stderr) => {
        if (err) {
            console.log("Error executing mongodump, no save were made")
            console.log(err)
            return;
        }
	console.log("Zipping database")
        setTimeout(async () => {
            const fileName = `${dir}/waapi-linkedin-save-${moment().format("YYYY-MM-DD HH:mm")}.zip`
            await zipDirectory("./dump", fileName)
            uploadFile(fileName);
        }, 2000)
    });
}

schedule.scheduleJob("0 8 * * *", () => {
    const dayJob = schedule.scheduleJob('0 */3 * * *', () => {
        saveMongoState()
        if (moment().hours() > 16) {
            dayJob.cancel()
            const nightJob = schedule.scheduleJob('0 3 * * *', () => {
                saveMongoState()
                nightJob.cancel()
            });
        }
    });
});

saveMongoState()
