# Happ doctor dashboard visualizations

Happ is a mobile app to help patients with life-changing illnesses maintain a positive mental and behavioral outlook. Learn more about <a href="https://drive.google.com/file/d/0B4oYHWoyxHvOU1JHM1RRRk1qT3c/view?usp=sharing">Happ here</a>.

The doctor dashboard visualizations use sample sleep data (minutes), step data and mood data from the newly released Philips HealthSuite Digital Platform (HSDP).
    
Social happiness data is gathered by a <a href="https://github.com/philipshackathon2015/server">worker performing sentiment analysis</a> of a fictional <a href="https://twitter.com/charlenemullyyy">Charlene Mulligan's Twitter feed</a>. Notifications based on this data are pushed to the <a href="https://github.com/philipshackathon2015/client">app client</a> using a <a href="https://github.com/philipshackathon2015/background-jobs">background job</a> watching data changes in MongoDB.

## To run

1. Clone the repo or download the three files as a zip file
2. Run `http-server` inside the folder you unzipped the files. If you don't have http-server, run `npm install http-server -g`
3. Visit localhost:8080