
Places = new Meteor.Collection('falesie');

getPlaceById = function(placeId) {
	return Places.find({_id: new Meteor.Collection.ObjectID(placeId) }, { fields: Climbo.perms.placePanel });
};

getPlacesByIds = function(placesIds) {
	placesIds = _.map(placesIds, function(id) {
		return new Meteor.Collection.ObjectID(id);
	});
	return Places.find({_id: {$in: placesIds} }, { fields: Climbo.perms.placeItem });
};


getPlacesByCheckins = function(usersIds) {
	usersIds = _.isArray(usersIds) ? {$in: usersIds} : usersIds;
	
	return Places.find({checkins: usersIds }, { fields: Climbo.perms.placeItem });
};

getPlacesByBBox = function(bbox) {

	//PATCH while minimongo not supporting $within $box queries
	if(Meteor.isClient) {

		var pp = _.filter(Places.find().fetch(), function(place) {

			return Climbo.util.geo.contains(bbox, place.loc);
		});

		return {
			fetch: function() {
				return pp;
			}
		};
	}
	else if(Meteor.isServer) 
		return Places.find({
			loc: {
				"$within": {
					"$box": bbox
				}
			}
		}, { fields: Climbo.perms.placeItem });
};

getCheckinsCountByPlaces = function(placesIds) {
	
	var places = getPlacesByIds(placesIds).fetch();

	return _.reduce(places, function(m, place) {
		return m + place.checkins.length;
	}, 0);
};

getPlacesByName = function(initial) {
	initial = Climbo.util.sanitizeRegExp(initial);

	if(initial.length < Meteor.settings.public.searchMinLen)
		return null;

	var ex = new RegExp('^'+ initial, 'i'),
		curPlace = Places.find({
			$or: [
				{name: ex},
				{near: ex}
			] }, { fields: Climbo.perms.placeSearch });

	if(curPlace.count()===0)
		curPlace = Places.find({
				prov: ex
			}, { fields: Climbo.perms.placeSearch });
	
	if(curPlace.count()===0)
		curPlace = Places.find({
				reg: ex
			}, { fields: Climbo.perms.placeSearch });

	return curPlace;
};
