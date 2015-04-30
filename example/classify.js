#!/usr/bin/env node

/**
 * Usage: ./classify.js --lon <lon_column> --lat <lat_column> --intr <intersections.geojson> data_input.csv
 *
 * Given a csv of points, add a column says either none (meaning the points isn't near an OSM intersection)
 * or a number (representing the number of ways that cross that intersection)
 *
 */

var fs = require('fs'),
    argv = require('minimist')(process.argv.slice(2)),
    parse = require('csv-parse'),
    csv = require('fast-csv'),
    tree = require('rbush')(15);

var tol = !isNaN(parseFloat(argv.tol)) ? parseFloat(argv.tol) : 0.0005; // the distance tolerance for searching for the nearby node
console.error(tol)
console.error(argv)
var geoj = JSON.parse(fs.readFileSync(__dirname + '/' + argv.intr));

(function bulkInsertGeojson(gj) {
    if (gj.type !== 'FeatureCollection') {
        throw new Error('GeoJSON input must be a feature collection');
    }
    tree.load(gj.features.map(function(feat) {
        var lon = feat.geometry.coordinates[0],
            lat = feat.geometry.coordinates[1];
        return [lon - tol, lat - tol, lon + tol, lat + tol, feat.properties];
    }));
    console.error('ok - built tree');
})(geoj);

var signals = [],
    header = true,
    lon, lat, meta,
    parser = parse({relax: true});
parser.on('readable', function() {    
    while (record = parser.read()) {
        if (header) {
            lon = record.indexOf(argv.lon);
            lat = record.indexOf(argv.lat);
            meta = {};
            record.filter(function(r) {
                return (r !== argv.lon) && (r !== argv.lat);
            }).map(function(r) {
                return [r, record.indexOf(r)];
            }).forEach(function(o) {
                meta[o[0]] = o[1];
            });
            header = false;
        } else if (
                    (parseFloat(record[lon]) < 180) && 
                    (parseFloat(record[lon]) > -180) && 
                    (parseFloat(record[lat]) > -90) && 
                    (parseFloat(record[lat]) < 90) 
                  ) {
            var data = {};
            for (key in meta) { data[String(key)] = record[meta[key]]; }
            var entry = [record[lon], record[lat], record[lon], record[lat], data];
            signals.push(entry);
        }
    }
})
parser.on('finish', function() {
    console.error('ok - parsed CSV');
    var output = [];
    var header = true;
    signals.forEach(function(s) {
        if (header) {
            var head = ['lon', 'lat'].concat(Object.keys(s[4]));
            head.push('ways_at_point');
            output.push(head);
            header = false;
        }
        var count = tree.search(s)[0] ? tree.search(s)[0][4].count : 'none';
        var meta_out = Object.keys(s[4]).map(function(key) {
            return s[4][key];
        });
        meta_out.push(count);
        var out = s.slice(1,3).concat(meta_out);
        output.push(out);
    });
    csv.writeToStream(process.stdout, output, {header:false});
    console.error('Done');
});

(fs.createReadStream(argv._[0]) || process.stdin).pipe(parser);
