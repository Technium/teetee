#!/usr/bin/python

import os.path
import sys
import json

def version(f):
	data = json.load(file(f))
	print data
	if isinstance(data, dict):
		return data.get('_version', 'unknown')
	return 'unknown'

versions = { os.path.basename(file):version(file) for file in sys.argv[1:] }
if versions:
	print json.dumps({ 'index': versions })
