#!/usr/bin/env bash

set -e -o pipefail

dbname="osm_tmp"
PSQL="psql -U postgres -d $dbname -q --no-align --field-separator ','"
psql -U postgres -q -c "DROP DATABASE IF EXISTS $dbname"
psql -U postgres -q -c "CREATE DATABASE $dbname"

echo "
    CREATE EXTENSION postgis;
    CREATE EXTENSION hstore;
" | $PSQL

echo "Importing OSM data"
osm2pgsql --create --database $dbname $1

echo "Extracting intersections"
echo "
    CREATE TABLE way_nodes AS (SELECT ST_DumpPoints(ST_Transform(way, 4326)) FROM planet_osm_roads);
    ALTER TABLE way_nodes ADD COLUMN geom GEOMETRY;
    UPDATE way_nodes SET geom = (st_dumppoints).geom;
    ALTER TABLE way_nodes DROP COLUMN st_dumppoints;
    CREATE TABLE final AS (SELECT * FROM (SELECT geom, COUNT(*) FROM way_nodes GROUP BY geom) AS foo WHERE count > 1);
" | $PSQL

echo "Creating geojson"
ogr2ogr -f "GeoJSON" $2 PG:"host=localhost dbname=osm user=postgres port=5432" "final(geom)"

psql -U postgres -q -c "DROP DATABASE $dbname"