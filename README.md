# OSM Intersection Finder

Given an `osm.bz2` file, this script returns a GeoJSON feature collection with points for the locations of intersections in the dataset

Dependencies:
- PostgreSQL (with extentsions Postgis and hstore)
- osm2pgsql
- ogr2ogr

### Usage

```
$ ./main.sh your_data.osm.bz2 output_file.geojson
```

### Method
1. Decompose all ways into the points that make up its line strings
2. Aggregate those points and count the occurences of each unique point
    - If a point lies on more than one way it assumed to be an intersection
    - If a point lies on 2 ways (this is represented by the count feature in the output geojson) then we can assume it is a simple intersection
    - If a point lies on more than 2 ways then we can assume it is a [complex intersection](http://wiki.openstreetmap.org/wiki/Lanes_and_complex_intersections_visual_approach)
