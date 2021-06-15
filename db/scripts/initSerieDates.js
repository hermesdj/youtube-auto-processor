let series = db.series.aggregate([
    {
        $match: {
            createdAt: {$exists: false}
        }
    },
    {
        $lookup: {
            from: 'episodes',
            let: {serieId: '$_id'},
            as: 'episodes',
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $eq: ['$serie', '$$serieId']
                        }
                    }
                },
                {
                    $sort: {
                        date_created: 1
                    }
                }
            ]
        }
    }
]);

while (series.hasNext()) {
    let serie = series.next();

    if (serie.episodes && serie.episodes.length > 0) {
        print(serie.planning_name + ' first episode is ' + serie.episodes[0].episode_number + ' date is ' + serie.episodes[0].date_created);

        db.series.updateOne({_id: serie._id}, {
            $set: {
                createdAt: serie.episodes[0].date_created,
                updatedAt: new Date()
            }
        });

        for (let episode of serie.episodes) {
            db.episodes.updateOne({_id: episode._id}, {$set: {createdAt: episode.date_created, updatedAt: new Date()}});
        }
    } else {
        print('serie ' + serie.planning_name + ' does not have any episodes');
    }
}

