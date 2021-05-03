import csv
from datetime import datetime
from decimal import Decimal
import json
import os
import sys

class CalculateCSV:
	def __init__(self):
		self.results = {}
		self.response = {
			'report': {},
			'filename': None,
			'y_axis_suffix': None
		}
		self.y_axis_suffix = list()

	def execute(self, file):

		try:
			with open(file, "r", encoding='utf-8', errors='ignore') as csv_file:
				rows = csv.DictReader(csv_file, delimiter=',')
				next(rows)
				for row in rows:
					self.__calculate(row['Transaction Date'], row['Amount (Merchant Currency)'])
					self.y_axis_suffix.append(row['Merchant Currency'])

			sorted_list = sorted(self.results, key=lambda x: datetime.strptime(x, '%b %d, %Y'))

			for item in sorted_list:
				self.response['report'][item] = str(self.results[item])

			filename = os.path.basename(file)
			self.response['filename'] = filename

			if(len(set(self.y_axis_suffix))==1):
				self.response['y_axis_suffix'] = self.y_axis_suffix[0]
			
			self.__print_electron()

		except FileNotFoundError:
 
			print('File does not exist!', file=sys.stderr)
			sys.exit(1)

		except (IOError, StopIteration):
			
			print('Something went wrong!', file=sys.stderr)
			sys.exit(1)

		except KeyError as e:

			print('Column "{}" not found!'.format(e.args[0]), file=sys.stderr)
			sys.exit(1)

		except ValueError as e:

			print(e, file=sys.stderr)
			sys.exit(1)

	def __calculate(self, date, amount):
		try:
			self.results[date] += Decimal(float(amount))
		except KeyError:
			self.results[date] = Decimal(float(amount))
		finally:
			for k, v in self.results.items():
				self.results[k] = round(self.results[k], 2)

	def __print_electron(self):
		data = json.dumps(self.response)
		print(data)
		sys.stdout.flush()

file = sys.argv[1]

if __name__ == '__main__':
	CalculateCSV().execute(file)

	