#!/usr/bin/env bash

#GEOJ='tmp.geojson'
#../main.sh $1 > $GEOJ
./classify.js --lon lon --lat lat --intr intersections.geojson data.csv

