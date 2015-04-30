# OSM Intersection Finder

Given an `osm.bz2` file, this script outputs a GeoJSON feature collection with points for the locations of intersections in the dataset.

Dependencies:
- PostgreSQL (with postgis extension)
- osm2pgsql
- ogr2ogr

### Usage

```
$ ./intersect.sh your_data.osm.bz2 > output.geojson
```

### Method
1. Decompose all ways into the points that make up its line strings
2. Collect those points and count the occurences of each unique point
    - If a point lies on more than one way it assumed to be an intersection
    - If a point lies on 2 ways (this is represented by the count feature in the output geojson) then we can assume it is a simple intersection
    - If a point lies on more than 2 ways then we can assume it is a [complex intersection](http://wiki.openstreetmap.org/wiki/Lanes_and_complex_intersections_visual_approach)
