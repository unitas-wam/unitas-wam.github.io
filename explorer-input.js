import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
const host=document.querySelector('#input-query-stage');
let renderer,scene,camera,controls,visible=false,dirty=false,texture,version=0;
function setup(){
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xffffff);host.append(renderer.domElement);
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(40,1,.01,100);camera.up.set(0,0,1);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.addEventListener('change',()=>{dirty=true});
 const resize=()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();dirty=true};new ResizeObserver(resize).observe(host);resize();
 new IntersectionObserver(es=>{visible=es[0].isIntersecting;dirty=true},{rootMargin:'100px'}).observe(host);
 const tick=()=>{requestAnimationFrame(tick);if(visible&&dirty&&!document.hidden){renderer.render(scene,camera);dirty=false}};requestAnimationFrame(tick);
}
function clean(){texture?.dispose();texture=null;scene.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose()});scene.clear()}
export async function updateInputPreview(m,initial,colors){
 if(!renderer)setup();clean();const token=++version;
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(initial.slice(),3));const c=new Float32Array(colors.length);
 for(let i=0;i<colors.length;i++){const v=colors[i]/255;c[i]=v<=.04045?v/12.92:((v+.055)/1.055)**2.4}
 geo.setAttribute('color',new THREE.BufferAttribute(c,3));const mat=new THREE.PointsMaterial({size:2,vertexColors:true,sizeAttenuation:false});scene.add(new THREE.Points(geo,mat));
 const C=new THREE.Matrix4().set(...m.camera_to_world.flat()),origin=new THREE.Vector3().setFromMatrixPosition(C),target=new THREE.Vector3(...m.interaction_center),K=m.intrinsic;
 const depth=Math.min(.45,Math.max(.18,origin.distanceTo(target)*.35));
 const corners=[[0,0],[m.width,0],[m.width,m.height],[0,m.height]].map(([x,y])=>new THREE.Vector3((x-K[0][2])/K[0][0]*depth,(y-K[1][2])/K[1][1]*depth,depth).applyMatrix4(C));
 const lines=[];for(let i=0;i<4;i++)lines.push(...origin.toArray(),...corners[i].toArray(),...corners[i].toArray(),...corners[(i+1)%4].toArray());
 const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));scene.add(new THREE.LineSegments(fg,new THREE.LineBasicMaterial({color:0x4874cb,transparent:true,opacity:.9})));
 const plane=new THREE.BufferGeometry();plane.setAttribute('position',new THREE.Float32BufferAttribute(corners.flatMap(p=>p.toArray()),3));plane.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,1,1,1,0,0,0],2));plane.setIndex([0,1,2,0,2,3]);
 const planeMat=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});scene.add(new THREE.Mesh(plane,planeMat));
 const box=new THREE.Box3().setFromBufferAttribute(geo.attributes.position);box.expandByPoint(origin);corners.forEach(p=>box.expandByPoint(p));const center=box.getCenter(new THREE.Vector3()),radius=Math.max(.35,box.getSize(new THREE.Vector3()).length()*.55);
 const back=new THREE.Vector3(1.25,-1.65,1.5).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,0,1),back).normalize(),up=new THREE.Vector3().crossVectors(back,right);
 const ty=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tx=ty*host.clientWidth/host.clientHeight;let distance=0;
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).sub(center);distance=Math.max(distance,Math.abs(p.dot(right))/tx+p.dot(back),Math.abs(p.dot(up))/ty+p.dot(back))}
 camera.position.copy(center).addScaledVector(back,distance*1.08);controls.target.copy(center);controls.minDistance=radius*.25;controls.maxDistance=radius*10;controls.update();

 host.dataset.points=initial.length/3;host.dataset.camera=m.camera_name;host.dataset.frame=m.source_frame;dirty=true;
 new THREE.TextureLoader().load(m.rgbURL,t=>{if(token!==version){t.dispose();return}texture=t;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();planeMat.map=t;planeMat.needsUpdate=true;dirty=true});
}
