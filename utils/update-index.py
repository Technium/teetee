#!/usr/bin/python

import os.path
import sys
import json

def version(f):
	data = json.load(file(f))
	#~ print data
	if isinstance(data, dict):
		return data.get('_version', 'unknown')
	return 'unknown'

def name(f):
	base = os.path.basename(f)
	name,ext = os.path.splitext(base)
	return name

versions = { name(filename):version(filename) for filename in sys.argv[1:] }
if versions:
	print json.dumps({ 'index': versions })
