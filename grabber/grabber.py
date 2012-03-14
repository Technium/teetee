#!/usr/bin/python

import urllib2


class Parser(object):
	def fetch(self):
		data = urllib2.fetch(self.url)
		results = self.parse(data)
		return results

	def parse(self, data, fields=self.config):
		return None


class Averages(Parser):
	url = r'http://bwdtta.co.uk/index.php?option=com_content&view=article&id=260&Itemid=295'
	config = [
		('name', SingleReMatch('<h1>(.*)</h1>')),
		(None, SingleReMatch('</h1><table border=0 width=700 cellpadding=0 cellspacing=0>(.*?)</table>'),
			(None, MultipleReMatch('<tr>(.*?)</tr>', skip=1),
				('average', SingleReMatch('<td.*?>(.*?)</td>', float, skip=0, take=1)),
				('player', SingleReMatch('<td.*?>(.*?)</td>', skip=1, take=1),
					('playedUp', SingleReMatch('\(Played Up\)', value=True, optional=True)),
				),
				('team', SingleReMatch('<td.*?>(.*?)</td>', skip=2, take=1)),
				('played', SingleReMatch('<td.*?>(.*?)</td>', int, skip=3, take=1)),
				('won', SingleReMatch('<td.*?>(.*?)</td>', int, skip=4, take=1)),
			),
		),
	]



if __name__ == '__main__':
	from pprint import pprint

	page = Averages()
	results = pages.fetch()
	pprint(results)
