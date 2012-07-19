# Some examples

## Platforms in Bozen
    <osm-script output="json">
      <area-query ref="3600047207"/>
      <recurse type="node-way" />
      <query type="way">
        <item />
        <has-kv k="highway" v="platform"/>
      </query>
      <union>
        <item />
        <recurse type="down" />
      </union>
      <print mode="body" order="quadtile"/>
    </osm-script>

## Turn Restrictions in bbox
    <osm-script output="json">
      <union into="r">
        <query type="relation">
          <bbox-query/>
          <has-kv k="type" v="restriction"/>
        </query>
      </union>
      <union>
        <item set="r" />
        <recurse type="relation-node" />
      </union>
      <query type="node">
        <item />
      </query>
      <union>
        <item />
        <item set="r" />
      </union>
      <print mode="body" order="quadtile"/>
    </osm-script>

## Drinking Water in bbox
    [out:json];
    (
      node
        ["amenity"="drinking_water"]
        (bbox)
    );
    out body;

## find and show ways with "Straße" misspelled
    <osm-script output="json">
      <query type="way">
        <has-kv k="highway"/>
        <has-kv k="name" regv="[Ss]trasse"/>
        <bbox-query/>
      </query>
      <union>
        <item />
        <recurse type="down" />
      </union>
      <print mode="body" order="quadtile"/>
    </osm-script>


