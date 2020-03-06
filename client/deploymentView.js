const QRCode = require('qrcode')

module.exports = function (sourceString) {
	return new Promise((resolve, reject) => {
		QRCode.toDataURL(sourceString).then((qrData) => {
			const content = `<!DOCTYPE html>
<html lang="en">
<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Cat Coding</title>
</head>
<body>
		<img src="${qrData}"/>
		<br/>
		<br/>
		<a href="${sourceString}">${sourceString}</a>
		<br/>
		<br/>
		<div style="font-size:8px">This temporary link will be available for 5 minutes</div>
</body>
</html>`
			resolve(content)
		}).catch(reject)
	})
}
