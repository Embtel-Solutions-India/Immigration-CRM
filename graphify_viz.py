import json
from graphify.build import build_from_json
from graphify.cluster import cluster
from graphify.export import to_html
from pathlib import Path

extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text())
G = build_from_json(extraction)
communities = cluster(G)

try:
    to_html(G, communities, 'graphify-out/graph.html')
    print('graph.html written')
except ValueError as e:
    print(f'Visualization skipped: {e}')
